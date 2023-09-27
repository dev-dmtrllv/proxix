const r=`import { State } from "proxix";\r
\r
const CounterState = State.create({ counter: 0 });\r
\r
State.intercept(CounterState, (key, value) => \r
{\r
	// prevent state change when the value is bigger than 10\r
	if(key === "counter")\r
		return value <= 10;\r
});\r
\r
const InterceptorExample = () =>\r
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
export default InterceptorExample;\r
`;export{r as default};
