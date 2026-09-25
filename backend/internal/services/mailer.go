package services

import (
	"fmt"
	"net/smtp"
	"os"
	"strconv"
	"strings"

	"github.com/raulferreyra/rsident/backend/internal/logging"
	"github.com/raulferreyra/rsident/backend/internal/models"
)

type Mailer struct {
	host     string
	port     string
	username string
	password string
	from     string
	company  string
}

func NewMailerFromEnv() *Mailer {
	mailer := &Mailer{
		host:     os.Getenv("SMTP_HOST"),
		port:     os.Getenv("SMTP_PORT"),
		username: os.Getenv("SMTP_USER"),
		password: os.Getenv("SMTP_PASSWORD"),
		from:     os.Getenv("SMTP_FROM"),
		company:  os.Getenv("ORDER_NOTIFICATION_EMAIL"),
	}

	if mailer.port == "" {
		mailer.port = "587"
	}

	if mailer.from == "" {
		mailer.from = mailer.username
	}

	return mailer
}

func (m *Mailer) configured() bool {
	return m.host != "" &&
		m.port != "" &&
		m.username != "" &&
		m.password != "" &&
		m.from != "" &&
		m.company != ""
}

func (m *Mailer) SendOrderEmails(order models.Order) (bool, bool) {
	if !m.configured() {
		logging.Error.Printf(
			"SMTP no configurado. No se enviaron correos del pedido %s",
			order.OrderNumber,
		)
		return false, false
	}

	customerBody := buildCustomerEmail(order)
	companyBody := buildCompanyEmail(order)

	customerSent := m.send(
		order.CustomerEmail,
		"RSIDENT - Confirmación de compra "+order.OrderNumber,
		customerBody,
	)

	companySent := m.send(
		m.company,
		"RSIDENT - Nueva compra "+order.OrderNumber,
		companyBody,
	)

	return customerSent, companySent
}

func (m *Mailer) send(to, subject, body string) bool {
	auth := smtp.PlainAuth(
		"",
		m.username,
		m.password,
		m.host,
	)

	message := strings.Join([]string{
		"From: " + m.from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")

	port, err := strconv.Atoi(m.port)
	if err != nil {
		logging.Error.Printf("SMTP port inválido: %v", err)
		return false
	}

	if err := smtp.SendMail(
		m.host+":"+strconv.Itoa(port),
		auth,
		m.from,
		[]string{to},
		[]byte(message),
	); err != nil {
		logging.Error.Printf(
			"Error enviando correo a %s: %v",
			to,
			err,
		)
		return false
	}

	return true
}

func buildCustomerEmail(order models.Order) string {
	var builder strings.Builder

	builder.WriteString("Hola,\n\n")
	builder.WriteString("Tu compra en RSIDENT ha sido registrada correctamente.\n\n")
	builder.WriteString("Pedido: " + order.OrderNumber + "\n")
	builder.WriteString(fmt.Sprintf("Total: S/ %.2f\n", order.Total))
	builder.WriteString("Envío: " + order.ShippingCarrier + " - " + order.ShippingZone + "\n")
	builder.WriteString("Persona que recogerá: " + order.PickupName + "\n")
	builder.WriteString("DNI: " + order.PickupDNI + "\n\n")
	builder.WriteString("Te informaremos por este medio sobre la tienda Shalom donde podrás recoger tu pedido.\n\n")
	builder.WriteString("Gracias por comprar en RSIDENT.")

	return builder.String()
}

func buildCompanyEmail(order models.Order) string {
	var builder strings.Builder

	builder.WriteString("Nueva compra registrada en RSIDENT.\n\n")
	builder.WriteString("Pedido: " + order.OrderNumber + "\n")
	builder.WriteString("Cliente: " + order.CustomerEmail + "\n")
	builder.WriteString("Dirección: " + order.Address + "\n")
	builder.WriteString("Zona: " + order.ShippingZone + "\n")
	builder.WriteString("Courier: " + order.ShippingCarrier + "\n")
	builder.WriteString("Persona que recoge: " + order.PickupName + "\n")
	builder.WriteString("DNI: " + order.PickupDNI + "\n")
	builder.WriteString(fmt.Sprintf("Subtotal: S/ %.2f\n", order.ProductsSubtotal))
	builder.WriteString(fmt.Sprintf("Envío: S/ %.2f\n", order.ShippingCost))
	builder.WriteString(fmt.Sprintf("Total: S/ %.2f\n\n", order.Total))
	builder.WriteString("Productos:\n")

	for _, item := range order.Items {
		builder.WriteString(fmt.Sprintf(
			"- %s | %s | %s | %d x S/ %.2f = S/ %.2f\n",
			item.Name,
			item.Color,
			item.Size,
			item.Quantity,
			item.UnitPrice,
			item.Subtotal,
		))
	}

	builder.WriteString("\nComprobante de pago: " + order.PaymentProofURL)

	return builder.String()
}
