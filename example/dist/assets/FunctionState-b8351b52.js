const t=`import { State } from "proxix";\r
\r
const StateExample = () =>\r
{\r
	const state = State.use({ counter: 0 });\r
\r
	return (\r
		<h1 onClick={() => state.counter++}>\r
			{state.counter}\r
		</h1>\r
	);\r
};\r
\r
export default StateExample;\r
`;export{t as default};
