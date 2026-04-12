/**
 * Kaspresso — Android UI test sample
 *
 * Kaspresso wraps Espresso with a more readable DSL, built-in flakiness
 * handling, and structured logging. This sample demonstrates the pattern
 * used for mobile UI automation on Android.
 *
 * Requirements: Android emulator or device, the target app installed.
 * Run with: ./gradlew connectedAndroidTest
 */
package com.example

import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.kaspersky.kaspresso.testcases.api.testcase.TestCase
import com.kaspersky.kaspresso.screens.KScreen
import io.github.kakaocup.kakao.text.KButton
import io.github.kakaocup.kakao.text.KTextView
import io.github.kakaocup.kakao.edit.KEditText
import io.github.kakaocup.kakao.recycler.KRecyclerView
import io.github.kakaocup.kakao.recycler.KRecyclerItem
import org.hamcrest.Matcher
import android.view.View
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

// ── Screen objects (equivalent of Page Object Model for mobile) ─────────────

object TodoScreen : KScreen<TodoScreen>() {
    override val layoutId = R.layout.activity_main
    override val viewClass = MainActivity::class.java

    val inputField = KEditText { withId(R.id.todo_input) }
    val addButton = KButton { withId(R.id.btn_add) }
    val emptyState = KTextView { withId(R.id.empty_state) }
    val todoList = KRecyclerView(
        builder = { withId(R.id.todo_recycler) },
        itemTypeBuilder = { itemType(::TodoItem) }
    )
}

class TodoItem(parent: Matcher<View>) : KRecyclerItem<TodoItem>(parent) {
    val title = KTextView { withId(R.id.todo_title) }
    val checkbox = KButton { withId(R.id.todo_checkbox) }
    val deleteButton = KButton { withId(R.id.btn_delete) }
}

// ── Tests ───────────────────────────────────────────────────────────────────

@RunWith(AndroidJUnit4::class)
class TodoListTest : TestCase() {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun userCanAddATodo() = run {
        step("Type a todo title and tap Add") {
            TodoScreen {
                inputField.typeText("Write unit tests for data layer")
                addButton.click()
            }
        }

        step("Todo appears in the list") {
            TodoScreen {
                todoList.firstChild<TodoItem> {
                    title.hasText("Write unit tests for data layer")
                }
            }
        }

        step("Input field is cleared after adding") {
            TodoScreen {
                inputField.hasEmptyText()
            }
        }
    }

    @Test
    fun userCanCompleteATodo() = run {
        step("Add a todo") {
            TodoScreen {
                inputField.typeText("Review test plan")
                addButton.click()
            }
        }

        step("Check the todo checkbox") {
            TodoScreen {
                todoList.firstChild<TodoItem> {
                    checkbox.click()
                }
            }
        }

        step("Todo is marked as completed") {
            TodoScreen {
                todoList.firstChild<TodoItem> {
                    title.hasTextColor(R.color.completed_text)
                }
            }
        }
    }

    @Test
    fun userCanDeleteATodo() = run {
        step("Add a todo") {
            TodoScreen {
                inputField.typeText("Todo to delete")
                addButton.click()
            }
        }

        step("Delete the todo") {
            TodoScreen {
                todoList.firstChild<TodoItem> {
                    deleteButton.click()
                }
            }
        }

        step("Empty state is shown") {
            TodoScreen {
                emptyState.isVisible()
                todoList.hasSize(0)
            }
        }
    }

    @Test
    fun emptyInputDoesNotAddTodo() = run {
        step("Tap Add without entering text") {
            TodoScreen {
                addButton.click()
            }
        }

        step("List remains empty") {
            TodoScreen {
                todoList.hasSize(0)
                emptyState.isVisible()
            }
        }
    }
}
