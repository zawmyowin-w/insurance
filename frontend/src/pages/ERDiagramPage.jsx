import erdHtml from '../../../artifacts/insurance-portal-erd.html?raw'

export default function ERDiagramPage() {
  return (
    <iframe
      title="Digital Insurance Portal ER Diagram"
      srcDoc={erdHtml}
      style={{
        display: 'block',
        width: '100%',
        height: '100vh',
        border: 0,
        background: '#f4f7fc',
      }}
    />
  )
}