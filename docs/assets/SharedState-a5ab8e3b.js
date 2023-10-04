const n=`import { State } from "proxix";\r
\r
const CounterState = State.create({ counter: 0 });\r
\r
const dec = () => CounterState.counter--;\r
const inc = () => CounterState.counter++;\r
\r
const DecrementButton = () =>\r
{\r
	const { counter } = State.use(CounterState)\r
\r
	return (\r
		<button onClick={dec}>\r
			decrement to {counter - 1}\r
		</button>\r
	);\r
};\r
\r
const IncrementButton = () =>\r
{\r
	const { counter } = State.use(CounterState)\r
\r
	return (\r
		<button onClick={inc}>\r
			increment to {counter + 1}\r
		</button>\r
	);\r
};\r
\r
const SharedStateExample = () =>\r
{\r
	const { counter } = State.use(CounterState)\r
\r
	return (\r
		<div>\r
			<DecrementButton />\r
			<h1>Counter: {counter}</h1>\r
			<IncrementButton />\r
		</div>\r
	);\r
};\r
\r
export default SharedStateExample;\r
`;export{n as default};
