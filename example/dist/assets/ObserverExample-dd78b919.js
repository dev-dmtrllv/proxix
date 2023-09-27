const r=`import { State } from "proxix";\r
\r
const CounterState = State.create({ counter: 0 });\r
\r
State.observe(CounterState, (key, value) => \r
{\r
	if(key === "counter")\r
		console.log("new counter value = ", value);\r
});\r
\r
const ObserverExample = () =>\r
{\r
	const { counter } = State.use(CounterState);\r
\r
	return (\r
		<h1 onClick={() => CounterState.counter++}>\r
			Counter: {counter} (Click me!)\r
		</h1>	\r
	);\r
};\r
\r
export default ObserverExample;\r
`;export{r as default};
