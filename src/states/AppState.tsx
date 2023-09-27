import { State } from "proxix";
import { Example } from "../examples/Example";

export const AppState = State.create<AppStateType>({
	currentExample: null
});

type AppStateType = {
	currentExample: Example | null;
};
