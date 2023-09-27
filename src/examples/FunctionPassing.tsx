import { State } from "proxix";

export const TestState = State.create({
	Component: () => Math.floor(Math.random() * 1000)
});

const TestComponent = () =>
{
	const { Component } = State.use(TestState);

	return (
		<div>
			<button onClick={() => TestState.Component = () => Math.floor(Math.random() * 1000)}>Update</button>
			<Component />
		</div>
	)
}

export default TestComponent;
