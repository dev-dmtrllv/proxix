import { State } from "proxix";
import ReactDOM from "react-dom/client";

const rand = () => Math.floor(Math.random() * 100);

@State.wrap
class Counter
{
	public count = 123;
	public list = [rand(), rand(), rand()];

	public inc = () => { console.log("inc() called!"); this.count++; }
	public push = () => { console.log("push() called!"); this.list.push(rand()); }
};

const external = new Counter();

const objTest = State.create({
	test: 123,
	list: [rand(), rand(), rand()]
});

const pushObj = () => objTest.list.push(rand());

const A = () => 
{
	const state = State.use(external);
	return (
		<h1 onClick={state.inc}>{state.count}</h1>
	);
};

const B = () => 
{
	const state = State.use(external);
	return (
		<h2 onClick={state.inc}>{state.count}</h2>
	);
};


const C = () => 
{
	const state = State.use(external);
	return (
		<h3 onClick={state.inc}>{state.count}</h3>
	);
};

const App = () =>
{
	const state = State.use(external);
	const objState = State.use(objTest);

	return (
		<>
			<A />
			<B />
			<C />
			<ul onClick={state.push}>
				{external.list.map((num, i) => <li key={i}>{num}</li>)}
			</ul>
			<h1 onClick={() => objState.test++}>objTest</h1>
			<h3 onClick={() => objState.test++}>{objState.test}</h3>
			<ul onClick={pushObj}>
				{objState.list.map((num, i) => <li key={i}>{num}</li>)}
			</ul>
		</>
	);
};



ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
