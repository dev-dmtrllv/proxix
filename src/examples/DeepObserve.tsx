import { State } from "proxix";

const DeepState = State.create({
	user: {
		session: {
			count: 0
		}
	}
});

State.observe(DeepState, (key, value) => 
{
	if(key === "user.session.count")
	{
		console.log(value)
	}
})


const DeepObserveExample = () =>
{
	const { user } = State.use(DeepState);

	return (
		<h1 onClick={_ => user.session.count++}>
			User session count: {user.session.count}
		</h1>
	);
};

export default DeepObserveExample;
