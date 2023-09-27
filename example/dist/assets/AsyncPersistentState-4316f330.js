const n=`import { State } from "proxix";\r
\r
const API_URL = "https://random-data-api.com/api/users/random_user?size=3";\r
\r
const AsyncState = State.createAsyncPersistent("persistent-api-call", () => \r
{\r
	return fetch(API_URL).then(res => res.json()) as Promise<User[]>;\r
});\r
\r
const AsyncPersistentStateExample = () =>\r
{\r
	const { data, error, isLoading, isCanceled, reset, cancel } = State.use(AsyncState);\r
	\r
	if (isLoading)\r
		return (\r
			<div>\r
				<button onClick={() => cancel()}>Cancel</button>\r
				<h1>Loading...</h1>\r
			</div>\r
		);\r
\r
	if (error || isCanceled)\r
		return (\r
			<div>\r
				<h1>{error ? \`\${error.name} - \${error.message}\` : "Canceled"}</h1>\r
				<button onClick={_ => reset()}>Reload</button>\r
			</div>\r
		);\r
\r
	return (\r
		<div>\r
			<button onClick={_ => reset()}>Reload</button>\r
			{data.map(({ id, first_name, last_name }) => (\r
				<div key={id}>\r
					{id} - {first_name} {last_name}\r
				</div>\r
			))}\r
		</div>\r
	);\r
};\r
\r
type User = {\r
	id: number;\r
	first_name: string;\r
	last_name: string;\r
};\r
\r
export default AsyncPersistentStateExample;\r
`;export{n as default};
