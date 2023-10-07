import { State } from "proxix";

const API_URL = "https://random-data-api.com/api/users/random_user?size=3";

const AsyncState = State.createAsync(() => 
{
	return fetch(API_URL).then(res => res.json()) as Promise<User[]>;
});

const AsyncComponent = () =>
{
	const { data, error, isLoading, isCanceled, reset, cancel } = State.use(AsyncState);
	
	if (isLoading)
		return (
			<div>
				<button onClick={() => cancel()}>Cancel</button>
				<h1>Loading...</h1>
			</div>
		);

	if (error || isCanceled)
		return (
			<div>
				<h1>{error ? `${error.name} - ${error.message}` : "Canceled"}</h1>
				<button onClick={() => reset()}>Reload</button>
			</div>
		);

	return (
		<div>
			<button onClick={() => reset()}>Reload</button>
			{data.map(({ id, first_name, last_name }) => (
				<div key={id}>
					{id} - {first_name} {last_name}
				</div>
			))}
		</div>
	);
};

const AsyncResolveCallbackExample = () =>
{
	const state = State.use({ isLoading });

	// const {} = 

	return (
		<div>
			<button>Start loading</button>

		</div>
	);
};

type User = {
	id: number;
	first_name: string;
	last_name: string;
};

export default AsyncResolveCallbackExample;
