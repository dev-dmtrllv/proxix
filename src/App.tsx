import { State } from "proxix";
import hljs from "highlight.js";
import React from "react";

import { AppState } from "./states/AppState";
import { loadExamples } from "./Example";

const examples = await loadExamples();

const Spacing = () => (
	<>
		<br />
		<hr />
		<br />
	</>
);

export const App = () =>
{
	const { currentExample } = State.use(AppState);

	React.useEffect(() => 
	{
		hljs.highlightAll();
	}, [currentExample]);

	if (currentExample)
		return (
			<div>
				<div style={{ border: "2px solid rgb(255, 255, 255, 0.2)", borderRadius: "6px", padding: "15px" }}>
					<button onClick={_ => AppState.currentExample = null}>back</button>
					<Spacing />
					<h1>Example:</h1>
					<br />
					<currentExample.Component />
					<Spacing />
					<h1>Code:</h1>
					<pre className="language-typescript typescript" style={{ tabSize: 4 }}>
						<code className="language-typescript typescript">
							{currentExample.code}
						</code>
					</pre>
				</div>
			</div>
		);

	return (
		<div>
			<h1>Examples:</h1>
			{examples.map(((example, i) => 
			{
				return (
					<a href={`#${example.name}`} key={i} onClick={e => e.preventDefault()}>
						<h2 onClick={_ => AppState.currentExample = example}>
							{example.name}
						</h2>
					</a>

				);
			}))}
		</div>
	);
};
