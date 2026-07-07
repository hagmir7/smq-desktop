import { useLoaderData } from 'react-router-dom';

export default function Dashboard() {
  const data = useLoaderData();
  return (
    <>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}