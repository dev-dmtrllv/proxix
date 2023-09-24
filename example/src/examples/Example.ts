export type Example = {
	name: string;
	code: string;
	Component: React.FC;
};

const parseName = (name: string): string =>
{
	name = name.replace("Example", "").trim();

	return name.split("").map((char, i) => 
	{

		if (i === 0)
			return char.toUpperCase();
		else if (char === char.toUpperCase())
			return ` ${char}`;
		return char;
	}).join("");
};

const escape = (s: string) => s;
// {
	// const lookup = {
	// 	'&': "&amp;",
	// 	'"': "&quot;",
	// 	'\'': "&apos;",
	// 	'<': "&lt;",
	// 	'>': "&gt;"
	// };
	// return s.replace(/[&"'<>]/g, c => lookup[c as keyof typeof lookup]);
// }

export const loadExamples = async () =>
{
	const examples = import.meta.glob("./**/*.tsx");
	const examplesSources = import.meta.glob("./**/*.tsx", { as: "raw" });

	return await Promise.all(Object.keys(examples).map(async (key) => 
	{
		const module = await examples[key]() as any;
		const example: Example = {
			code: examplesSources[key] ? escape(await examplesSources[key]()) : "",
			Component: typeof module.default == "function" ? module.default : (() => null),
			name: module.default.name ? parseName(module.default.name) : "UNDEFINED"
		};
		return example;
	}));
};
