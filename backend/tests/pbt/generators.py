"""Domain-specific Hypothesis strategies for property-based testing (PBT-07)."""

from hypothesis import strategies as st

# --- Primitive strategies ---

store_ids = st.text(
    alphabet=st.characters(whitelist_categories=("Ll", "Lu", "Nd"), whitelist_characters="-"),
    min_size=8,
    max_size=36,
)

table_numbers = st.integers(min_value=1, max_value=100)

passwords = st.text(min_size=4, max_size=50, alphabet=st.characters(min_codepoint=32, max_codepoint=126))

menu_names = st.text(min_size=1, max_size=100, alphabet=st.characters(min_codepoint=0x30, max_codepoint=0xD7A3))

menu_prices = st.integers(min_value=0, max_value=10_000_000)

quantities = st.integers(min_value=1, max_value=99)

category_names = st.text(min_size=1, max_size=50, alphabet=st.characters(min_codepoint=0x30, max_codepoint=0xD7A3))

sort_orders = st.integers(min_value=0, max_value=1000)

# --- Composite strategies ---


@st.composite
def menu_items(draw):
    """Generate a menu item dict."""
    return {
        "name": draw(menu_names),
        "price": draw(menu_prices),
        "description": draw(st.one_of(st.none(), st.text(max_size=200))),
        "image_url": draw(st.one_of(st.none(), st.text(min_size=5, max_size=200))),
    }


@st.composite
def order_items(draw, menu_id_strategy=st.integers(min_value=1, max_value=100)):
    """Generate an order item create dict."""
    return {
        "menu_id": draw(menu_id_strategy),
        "quantity": draw(quantities),
    }


@st.composite
def order_item_lists(draw, min_items=1, max_items=10, menu_id_strategy=st.integers(min_value=1, max_value=100)):
    """Generate a list of order items."""
    count = draw(st.integers(min_value=min_items, max_value=max_items))
    items = []
    for _ in range(count):
        items.append(draw(order_items(menu_id_strategy=menu_id_strategy)))
    return items


@st.composite
def order_snapshots(draw):
    """Generate order item snapshots (as stored in OrderItem/OrderHistory)."""
    return {
        "menu_name": draw(menu_names),
        "quantity": draw(quantities),
        "unit_price": draw(menu_prices),
    }
