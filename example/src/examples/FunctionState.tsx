import { State } from "proxix";

const StateExample = () =>
{
	const state = State.use({ counter: 0 });

	return (
		<h1 onClick={() => state.counter++}>
			{state.counter}
		</h1>
	);
};

export default StateExample;
