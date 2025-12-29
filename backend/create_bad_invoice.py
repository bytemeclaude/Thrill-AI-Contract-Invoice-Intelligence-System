from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_bad_invoice():
    c = canvas.Canvas("bad_invoice.pdf", pagesize=letter)
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "INVOICE")
    
    # Vendor Info (Matches the contract's "Mock Vendor")
    c.setFont("Helvetica", 12)
    c.drawString(50, 720, "Vendor: Mock Vendor")
    c.drawString(50, 705, "Address: 123 Evil Corp Lane")
    
    # Invoice Details
    c.drawString(400, 720, "Invoice #: INV-BAD-001")
    c.drawString(400, 705, "Date: 2024-02-01")
    
    # Mismatched Terms
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 650, "Payment Terms: Net 10") # Mismatch! Contract says 30 days.
    
    # Line Items
    c.setFont("Helvetica", 12)
    y = 600
    c.drawString(50, y, "Description")
    c.drawString(300, y, "Amount")
    y -= 20
    c.line(50, y+15, 500, y+15)
    
    c.drawString(50, y, "Consulting Services (Rush)")
    c.drawString(300, y, "$5,000.00")
    
    y -= 40
    c.setFont("Helvetica-Bold", 12)
    c.drawString(200, y, "Total Amount: $5,000.00")
    
    c.save()

if __name__ == "__main__":
    create_bad_invoice()
