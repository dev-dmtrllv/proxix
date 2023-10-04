import State from "proxix";

const TodoState = State.createPersistent<TodoStateType>("todo", {
	input: "",
	todos: [],
});

const addTodo = (todo?: string) =>
{
	if (todo)
	{
		TodoState.todos.push({ todo, done: false });
	}
	else if (TodoState.input)
	{
		TodoState.todos.push({ todo: TodoState.input, done: false });
		TodoState.input = "";
	}
};

const removeTodoAt = (index: number) =>
{
	if (index >= TodoState.todos.length)
		return;

	TodoState.todos.splice(index, 1);
};

const toggleTodoAt = (index: number) =>
{
	if (index >= TodoState.todos.length)
		return;

	TodoState.todos[index].done = !TodoState.todos[index].done;
};

const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => TodoState.input = e.target.value;

const onKey = (e: React.KeyboardEvent) => e.key === "Enter" && addTodo();

const TodoExample = () =>
{
	const { input, todos } = State.use(TodoState);

	return (
		<div>
			<input value={input} onChange={onInputChange} onKeyDown={onKey} />
			<ul>
				{todos.map(({ todo, done }, i) => 
				{
					const remove = () => removeTodoAt(i);
					const toggle = () => toggleTodoAt(i);

					return (
						<li key={i} onClick={toggle}>
							<span style={{ textDecoration: done ? "line-through" : "none" }}>{todo}</span>
							<span onClick={remove} style={{ marginLeft: "5px", cursor: "pointer" }}>
								❌
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default TodoExample;

type Todo = {
	todo: string;
	done: boolean;
};

type TodoStateType = {
	todos: Todo[];
	input: string;
};
