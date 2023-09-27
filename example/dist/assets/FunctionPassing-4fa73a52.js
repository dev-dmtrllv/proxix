const t=`import { State } from "proxix";\r
\r
export const TestState = State.create({\r
	Component: () => Math.floor(Math.random() * 1000)\r
});\r
\r
const TestComponent = () =>\r
{\r
	const { Component } = State.use(TestState);\r
\r
	return (\r
		<div>\r
			<button onClick={() => TestState.Component = () => Math.floor(Math.random() * 1000)}>Update</button>\r
			<Component />\r
		</div>\r
	)\r
}\r
\r
export default TestComponent;\r
`;export{t as default};
