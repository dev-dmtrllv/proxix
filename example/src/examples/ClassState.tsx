import { State } from "proxix";

class ClassState
{
	@State.observable
	private counter_: number = 0;

	public get counter() { return this.counter_; }

	public readonly dec = () => this.counter_--;
	public readonly inc = () => this.counter_++;
}

const ClassExample = () =>
{
	const { counter, dec, inc } = State.use(ClassState);
	
	return (
		<>
			<button onClick={dec}>dec</button>
			<div>{counter}</div>
			<button onClick={inc}>inc</button>
		</>
	);
};

export default ClassExample;
