import { State } from "proxix";

const CounterState = State.create({ counter: 0 });

const dec = () => CounterState.counter--;
const inc = () => CounterState.counter++;

const DecrementButton = () =>
{
	const { counter } = State.use(CounterState)

	return (
		<button onClick={dec}>
			decrement to {counter - 1}
		</button>
	);
};

const IncrementButton = () =>
{
	const { counter } = State.use(CounterState)

	return (
		<button onClick={inc}>
			increment to {counter + 1}
		</button>
	);
};

const SharedStateExample = () =>
{
	const { counter } = State.use(CounterState)

	return (
		<div>
			<DecrementButton />
			<h1>Counter: {counter}</h1>
			<IncrementButton />
		</div>
	);
};

export default SharedStateExample;
