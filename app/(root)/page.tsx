import { auth, signOut } from "@/auth";

const Home = async()=> {
  const session = await auth();
  console.log(session);

  return (
    <>
    <h1 className="text-primary-500 text-3xl">OverFlow</h1>
    
    </>
  );
}
export default Home;