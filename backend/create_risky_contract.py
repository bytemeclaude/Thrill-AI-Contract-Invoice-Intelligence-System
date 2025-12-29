from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_risky_contract():
    c = canvas.Canvas("risky_contract.pdf", pagesize=letter)
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "SERVICE AGREEMENT (RISKY)")
    
    # Section 1: Payment Terms (Risky: Net 90)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 700, "1. Payment Terms")
    c.setFont("Helvetica", 12)
    c.drawString(50, 685, "Customer shall pay all undisputed invoices within ninety (90) days of receipt.")
    
    # Section 2: Liability (Risky: Unlimited)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 650, "2. Limitation of Liability")
    c.setFont("Helvetica", 12)
    c.drawString(50, 635, "The Vendor's liability under this Agreement shall be unlimited for all claims.")
    
    # Section 3: Indemnification (Standard-ish)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 600, "3. Indemnification")
    c.setFont("Helvetica", 12)
    c.drawString(50, 585, "Vendor agrees to indemnify Customer against all third-party claims.")

    c.save()

if __name__ == "__main__":
    create_risky_contract()
