// Update the styles section
const styles = StyleSheet.create({
  // ... existing styles ...
  numberCol: { width: '8%', textAlign: 'center' },
  articleCol: { width: '15%', textAlign: 'center' },
  productCol: { width: '32%', textAlign: 'left' },
  quantityCol: { width: '10%', textAlign: 'center' },
  priceCol: { width: '12%', textAlign: 'right' },
  totalCol: { width: '8%', textAlign: 'right' },
  vatCol: { width: '5%', textAlign: 'center' },
});

// Update the table header
<View style={styles.tableHeader}>
  <Text style={[styles.numberCol, styles.bold]}>Nr.</Text>
  <Text style={[styles.articleCol, styles.bold]}>Artikel</Text>
  <Text style={[styles.productCol, styles.bold]}>Bezeichnung</Text>
  <Text style={[styles.quantityCol, styles.bold]}>Menge</Text>
  <Text style={[styles.priceCol, styles.bold]}>Einzel €</Text>
  <Text style={[styles.totalCol, styles.bold]}>Gesamt</Text>
  <Text style={[styles.vatCol, styles.bold]}>MwSt.</Text>
</View>

// Update the table row
{order.items.map((item, index) => (
  <View key={index} style={styles.tableRow}>
    <Text style={styles.numberCol}>{index + 1}</Text>
    <Text style={styles.articleCol}>{item.product.artikelNr}</Text>
    <Text style={styles.productCol}>{item.product.name}</Text>
    <View style={styles.quantityCol}>
      <View style={styles.quantityBox}>
        <Text style={styles.quantityText}>{item.quantity.toFixed(2)}</Text>
      </View>
    </View>
    <Text style={styles.priceCol}>{item.vkPrice.toFixed(2)}</Text>
    <Text style={styles.totalCol}>
      {(item.quantity * item.vkPrice).toFixed(2)}
    </Text>
    <Text style={styles.vatCol}>{item.product.mwst}</Text>
  </View>
))}