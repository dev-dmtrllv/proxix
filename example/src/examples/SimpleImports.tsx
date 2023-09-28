import { getGlobal, global, observable, use } from "proxix";
import React from "react";

@global
class SingletonState
{
	@observable
	private counter_: number = 0;

	public get counter() { return this.counter_; }

	public readonly dec = () => this.counter_--;
	public readonly inc = () => this.counter_++;
}

const OtherPart = () =>
{
	const { counter } = use(SingletonState);
	
	return (
		<h1>
			count: {counter}
		</h1>
	);
};

const SimpleImportsExample = () =>
{
	const { counter, dec, inc } = use(SingletonState);

	React.useEffect(() => 
	{
		console.log(getGlobal(SingletonState))
	}, []);
	
	return (
		<>
			<button onClick={dec}>dec</button>
			<div>{counter}</div>
			<button onClick={inc}>inc</button>
			<br/>
			<OtherPart />
		</>
	);
};

export default SimpleImportsExample;
