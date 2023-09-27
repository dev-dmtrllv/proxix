export const isClass = (x: any): x is new (...args: any[]) => any =>
{
	return (typeof x === "function") && (x.prototype) && !(Object.getOwnPropertyDescriptor(x, "prototype")?.writable);
};

export const match = (a: any, b: any) =>
{
	if (typeof a !== typeof b)
		return false;
	
	if (typeof a === "object")
	{
		if (a === null)
			return b === null;

		if(b === null)
			return false;

		if (Array.isArray(a))
		{
			if (a.length !== b.length)
				return false;
			for (let i = 0; i < a.length; i++)
				if (!match(a[i], b[i]))
					return false;
			return true;
		}

		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (!match(keysA, keysB))
			return false;

		for (const k in a)
			if (!match(a[k], b[k]))
				return false;

		return true;
	}

	return a === b;
};

type Primitive = number | bigint | string | boolean | symbol | null | undefined;

export const isPrimitive = (obj: any): obj is Primitive => typeof obj !== "object" || (obj === null);

export const clone = <T>(obj: T): T =>
{
	const type = typeof obj;
	
	if(obj && (type === "object"))
	{
		if(Array.isArray(obj))
		{
			const newArray = new Array(obj.length);
			for(let i = 0; i != obj.length; i++)
				newArray[i] = clone(obj[i]);
			return newArray as T;
		}
		else
		{
			const newObj = {} as any;
			for(const k in obj)
				newObj[k] = clone(obj[k]);
			return newObj;
		}
	}

	return obj;
};
