export default function PendingPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-yellow-600 mb-4">승인 대기 중</h1>
        <p className="text-gray-700">
          계정이 생성되었으며 현재 관리자의 승인을 기다리고 있습니다.
          승인이 완료되면 접속하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
