import { State } from "proxix";

@State.global
class SingletonState
{
	@State.observable
	private counter_: number = 0;

	public get counter() { return this.counter_; }

	public readonly dec = () => this.counter_--;
	public readonly inc = () => this.counter_++;
}

const OtherPart = () =>
{
	const { counter } = State.use(SingletonState);
	
	return (
		<h1>
			count: {counter}
		</h1>
	);
};

const SingletonClassExample = () =>
{
	const { counter, dec, inc } = State.use(SingletonState);
	
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

export default SingletonClassExample;
