import { State } from "proxix";

const CounterState = State.create({ counter: 0 });

State.intercept(CounterState, ([key, value]) => 
{
	// prevent state change when the value is bigger than 10
	if(key === "counter")
		return value <= 10;
});

const InterceptorExample = () =>
{
	const { counter } = State.use(CounterState);

	return (
		<h1 onClick={() => CounterState.counter++}>
			Counter: {counter} (Click me!)
		</h1>	
	);
};

export default InterceptorExample;
