export default function LogoutTab() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">Logout</h2>
      <p className="mt-4 text-gray-600">You will be logged out from all sessions.</p>
      <button className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700">
        Logout Now
      </button>
    </div>
  );
}
