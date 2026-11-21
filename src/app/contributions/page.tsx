import Contributions from "./view";
export default function Page(props:{searchParams:Promise<{group?:string}>}){return <Contributions {...props}/>;}
