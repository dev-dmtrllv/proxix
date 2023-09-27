import { State } from "proxix";

const CounterState = State.create({ counter: 0 });

State.observe(CounterState, (key, value) => 
{
	if(key === "counter")
		console.log("new counter value = ", value);
});

const ObserverExample = () =>
{
	const { counter } = State.use(CounterState);

	return (
		<h1 onClick={() => CounterState.counter++}>
			Counter: {counter} (Click me!)
		</h1>	
	);
};

export default ObserverExample;
