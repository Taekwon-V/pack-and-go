export default function PendingPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-yellow-600 mb-4">Approval Pending</h1>
        <p className="text-gray-700">
          Your account has been created and is currently waiting for admin approval. 
          You will receive an email once your account is approved.
        </p>
      </div>
    </div>
  );
}
