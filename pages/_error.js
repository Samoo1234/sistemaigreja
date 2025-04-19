function Error({ statusCode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          {statusCode
            ? `Um erro ${statusCode} ocorreu no servidor`
            : 'Um erro ocorreu no cliente'}
        </h1>
        <p className="text-gray-600">
          Estamos trabalhando para resolver isso o mais rápido possível.
        </p>
        <div className="mt-6">
          <a
            href="/secretaria"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Voltar para a Secretaria
          </a>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 