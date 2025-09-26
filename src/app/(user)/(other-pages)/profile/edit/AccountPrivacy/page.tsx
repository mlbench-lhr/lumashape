export default function AccountPrivacy() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">Account Privacy</h2>
      <p className="mt-4 text-gray-600">
        Manage who can see your profile and activity.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" /> Show email publicly
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" /> Allow search engines to index
        </label>
      </div>
    </div>
  );
}
