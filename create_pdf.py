from reportlab.pdfgen import canvas

def create_pdf(filename):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, "Contract Agreement")
    c.drawString(100, 700, "1. Scope of Work")
    c.drawString(100, 680, "The Vendor shall provide services...")
    
    c.showPage() # Page 2
    c.drawString(100, 750, "2. Payment Terms")
    c.drawString(100, 730, "The Company shall pay the Vendor within 30 days of receipt of invoice.")
    c.drawString(100, 710, "Late payments shall incur a 5% penalty.")
    
    c.save()

if __name__ == "__main__":
    create_pdf("contract.pdf")
    print("Created contract.pdf")
