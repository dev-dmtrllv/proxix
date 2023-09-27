const n=`import { State } from "proxix";\r
\r
@State.global\r
class SingletonState\r
{\r
	private counter_: number = 0;\r
\r
	public get counter() { return this.counter_; }\r
\r
	public readonly dec = () => this.counter_--;\r
	public readonly inc = () => this.counter_++;\r
}\r
\r
const OtherPart = () =>\r
{\r
	const { counter } = State.use(SingletonState);\r
	\r
	return (\r
		<h1>\r
			count: {counter}\r
		</h1>\r
	);\r
};\r
\r
const SingletonClassExample = () =>\r
{\r
	const { counter, dec, inc } = State.use(SingletonState);\r
	\r
	return (\r
		<>\r
			<button onClick={dec}>dec</button>\r
			<div>{counter}</div>\r
			<button onClick={inc}>inc</button>\r
			<br/>\r
			<OtherPart />\r
		</>\r
	);\r
};\r
\r
export default SingletonClassExample;\r
`;export{n as default};
