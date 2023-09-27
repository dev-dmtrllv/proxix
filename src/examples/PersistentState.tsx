import { State } from "proxix";

const PersistentState = State.createPersistent("persistent-counter", { counter: 0 });

const PersistentStateExample = () =>
{
	const state = State.use(PersistentState);

	return (
		<div>
			<h1 onClick={() => state.counter++}>
				{state.counter}
			</h1>
			<button onClick={() => State.reset(PersistentState)}>Reset</button>
		</div>
	);
};

export default PersistentStateExample;
