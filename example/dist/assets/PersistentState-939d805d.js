const t=`import { State } from "proxix";\r
\r
const PersistentState = State.createPersistent("persistent-counter", { counter: 0 });\r
\r
const PersistentStateExample = () =>\r
{\r
	const state = State.use(PersistentState);\r
\r
	return (\r
		<div>\r
			<h1 onClick={() => state.counter++}>\r
				{state.counter}\r
			</h1>\r
			<button onClick={() => State.reset(PersistentState)}>Reset</button>\r
		</div>\r
	);\r
};\r
\r
export default PersistentStateExample;\r
`;export{t as default};
