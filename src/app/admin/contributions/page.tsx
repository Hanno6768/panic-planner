import Contributions from "../../contributions/view";
export default function AdminContributions(props:{searchParams:Promise<{group?:string}>}){return <Contributions {...props} adminView/>;}
