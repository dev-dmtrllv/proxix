const n=`import { State } from "proxix";\r
\r
class ClassState\r
{\r
	private counter_: number = 0;\r
\r
	public get counter() { return this.counter_; }\r
\r
	public readonly dec = () => this.counter_--;\r
	public readonly inc = () => this.counter_++;\r
}\r
\r
const ClassExample = () =>\r
{\r
	const { counter, dec, inc } = State.use(ClassState);\r
	\r
	return (\r
		<>\r
			<button onClick={dec}>dec</button>\r
			<div>{counter}</div>\r
			<button onClick={inc}>inc</button>\r
		</>\r
	);\r
};\r
\r
export default ClassExample;\r
`;export{n as default};
