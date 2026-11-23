Attribute VB_Name = "RefreshPortfolio"
Option Explicit

Public Sub RefreshPortfolio()
    ' Refresh workbook connections / Power Query and recalculate formulas.
    ThisWorkbook.RefreshAll
    Application.CalculateFull
    MsgBox "Refresh requested. Check Queries & Connections for errors.", vbInformation
End Sub
