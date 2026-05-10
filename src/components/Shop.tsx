import { FOOD_ITEMS } from '../data/foodItems'
import type { FoodItem } from '../data/foodItems'
import { PixelHeart } from './PixelHeart'

interface Props {
  hearts: number
  onBuy: (item: FoodItem) => void
  onClose: () => void
}

export function Shop({ hearts, onBuy, onClose }: Props) {
  const sorted = [...FOOD_ITEMS].sort((a, b) => a.cost - b.cost)

  return (
    <div className="popup-outer popup-shop">
      <div className="popup-mid">
        <div className="popup-inner popup-tracker">
          <div className="popup-title">Bakery Shop</div>

          <div className="shop-grid">
            {sorted.map(item => {
              const canAfford = hearts >= item.cost
              return (
                <div key={item.id} className="shop-card">
                  <div className="shop-emoji">{item.emoji}</div>
                  <div className="shop-name">{item.name}</div>
                  <div className="shop-cost">
                    <PixelHeart size={3} color="#E8394A" />
                    <span className="shop-cost-num">{item.cost}</span>
                  </div>
                  <button
                    className={`pixel-btn shop-buy-btn${canAfford ? '' : ' shop-buy-disabled'}`}
                    disabled={!canAfford}
                    onClick={() => onBuy(item)}
                  >
                    Buy
                  </button>
                </div>
              )
            })}
          </div>

          <div className="popup-form-actions" style={{ marginTop: '12px' }}>
            <button className="pixel-btn btn-settings" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
