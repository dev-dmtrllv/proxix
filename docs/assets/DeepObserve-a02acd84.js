const e=`import { State } from "proxix";\r
\r
const DeepState = State.create({\r
	user: {\r
		session: {\r
			count: 0\r
		}\r
	}\r
});\r
\r
State.observe(DeepState, (key, value) => \r
{\r
	if(key === "user.session.count")\r
	{\r
		console.log(value)\r
	}\r
})\r
\r
\r
const DeepObserveExample = () =>\r
{\r
	const { user } = State.use(DeepState);\r
\r
	return (\r
		<h1 onClick={_ => user.session.count++}>\r
			User session count: {user.session.count}\r
		</h1>\r
	);\r
};\r
\r
export default DeepObserveExample;\r
`;export{e as default};
