# Proxix - A proxy based React state management library

## Installing
Run `npm install dev-dmtrllv/proxix#master` to insstall the package from github.

## Example
```tsx
const CounterState = State.create({ counter: 0 });

// to keep the state persistent in localStorage use State.createPersistent(name, state);

// to initialize the state async its possible to provide an async function instead of a deafult state
const AsyncState = State.createAsync(async () => await fetch("/some-api").then(res => res.text()));

const increment = () => CounterState.counter++;
const decrement = () => CounterState.counter--;

// When intercepting you can return false to ignore the change
State.intercept(CounterState, (key, value, oldState, newState) => 
{
	console.log("intercepting", { key, value, oldState, newState });

	if(key === "counter")
		return value < 10;

	return true;
});

// when no update is intercepted and ignore observe will be called
State.observe(CounterState, (key, value, oldState, newState) => 
{
	console.log("observing", { key, value, oldState, newState });
});


const Counter = () =>
{
	// use State.use(state) to trigger updates on this component
	const { counter } = State.use(CounterState);

	// It is also possible to use state local to this component only 
	const state = State.use({ hello: "local state" });

	return (
		<div>
			<button onClick={decrement}>
				-
			</button>
			<div>
				{counter}
			</div>
			<button onClick={increment}>
				+
			</button>
		</div>
	);
};
```
