export default function DeleteAccount() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-red-600">Delete Account</h2>
      <p className="mt-4 text-gray-600">
        Once deleted, your account cannot be recovered.
      </p>
      <button className="mt-6 px-5 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700">
        Delete My Account
      </button>
    </div>
  );
}
