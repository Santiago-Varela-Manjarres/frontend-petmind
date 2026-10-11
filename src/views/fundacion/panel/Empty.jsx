import Icon from '../../../components/ui/Icon'

// Estado vacío de las tablas y listas del panel.
export default function Empty({ text }) {
  return (
    <div className="empty-state">
      <Icon name="inbox" />
      <h3>Sin registros todavía</h3>
      <p>{text}</p>
    </div>
  )
}
