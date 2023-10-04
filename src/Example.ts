export type Example = {
	name: string;
	code: string;
	Component: React.FC;
};

const parseName = (name: string): string =>
{
	name = name.replace("Example", "").trim().replace(".tsx", "");

	if(name.startsWith("./"))
		name = name.replace("./", "");

	return name.split("").map((char, i) => 
	{
		if (i === 0)
			return char.toUpperCase();
		else if (char === char.toUpperCase())
			return ` ${char}`;
		return char;
	}).join("");
};

export const loadExamples = (): Example[] =>
{
	const modules = require.context("./examples", true, /\.tsx?$/i, "sync");
	const sources = require.context("!raw-loader!./examples", true, /\.tsx?$/i, "sync");

	return modules.keys().map((k): Example => 
		{
			const source = sources(k);
			const mod = modules(k);

			return {
				code: source.default,
				Component: mod.default || (() => null),
				name: parseName(k)
			};
		});
};
