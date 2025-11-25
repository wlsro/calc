import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X } from 'lucide-react';

// ============================================================================
// КОНФІГУРАЦІЯ
// ============================================================================

// Перемикач для показу цін окремих елементів (на майбутнє)
const SHOW_ITEM_PRICES = false;

// URL Google Sheets (замініть на свій після створення таблиці)
// Інструкція в кінці коду
const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_SHEETS_URL_HERE';

// ============================================================================
// ТЕСТОВІ ДАНІ (видаліть після підключення Google Sheets)
// ============================================================================

const MOCK_DATA = {
  baguette: [
    { article: 'AM1515-015', model: 'AM1515', color: '015', pricePerMeter: 150, width: 30, additionalSize: 12 },
    { article: 'AM1515-020', model: 'AM1515', color: '020', pricePerMeter: 150, width: 30, additionalSize: 12 },
    { article: 'DM1715-073', model: 'DM1715', color: '073', pricePerMeter: 220, width: 45, additionalSize: 15 },
    { article: 'BK2020-001', model: 'BK2020', color: '001', pricePerMeter: 180, width: 35, additionalSize: 13 },
  ],
  passepartout: [
    { article: 'P-001', name: 'Паспарту біле 1.5мм', pricePerM2: 80 },
    { article: 'P-002', name: 'Паспарту чорне 2мм', pricePerM2: 95 },
    { article: 'P-003', name: 'Паспарту кремове 1.5мм', pricePerM2: 85 },
  ],
  components: {
    innerWall: [
      { name: 'ДВП', pricePerM2: 45, type: 'area' },
      { name: 'Біле ДВП', pricePerM2: 55, type: 'area' },
      { name: 'Підрамник', pricePerMeter: 35, type: 'perimeter' },
      { name: 'ДВП + Підрамник', pricePerM2: 45, pricePerMeter: 35, type: 'combined' },
      { name: 'Без нічого', pricePerM2: 0, type: 'none' },
    ],
    glass: [
      { name: 'Скло звичайне', pricePerM2: 120 },
      { name: 'Скло антиблікове', pricePerM2: 180 },
      { name: 'Скло акрилове', pricePerM2: 150 },
      { name: 'Без скла', pricePerM2: 0 },
    ],
    backWall: [
      { name: 'Задник картон', pricePerM2: 30 },
      { name: 'Задник ДВП', pricePerM2: 40 },
      { name: 'Без задніка', pricePerM2: 0 },
    ],
    mounting: [
      { name: 'Вушка', price: 15 },
      { name: 'Вушка + ніжка', price: 25 },
      { name: 'Без кріплення', price: 0 },
    ],
  },
  workTypes: [
    { name: 'Натяжка', price: 200 },
    { name: 'Оформлення', price: 150 },
    { name: 'Зшивка рамки', price: 100 },
  ],
};

// ============================================================================
// КОМПОНЕНТ
// ============================================================================

export default function FrameCalculator() {
  // Дані
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);

  // Стан форми
  const [baguetteSearch, setBaguetteSearch] = useState('');
  const [selectedBaguette, setSelectedBaguette] = useState(null);
  const [withPassepartout, setWithPassepartout] = useState(false);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  
  // Паспарту
  const [passepartout1Search, setPassepartout1Search] = useState('');
  const [selectedPassepartout1, setSelectedPassepartout1] = useState(null);
  const [passepartout1Field, setPassepartout1Field] = useState('');
  const [showPassepartout2, setShowPassepartout2] = useState(false);
  const [passepartout2Search, setPassepartout2Search] = useState('');
  const [selectedPassepartout2, setSelectedPassepartout2] = useState(null);
  const [passepartout2Field, setPassepartout2Field] = useState('');

  // Компоненти
  const [innerWall, setInnerWall] = useState(data.components.innerWall[0].name);
  const [glass, setGlass] = useState(data.components.glass[0].name);
  const [backWall, setBackWall] = useState(data.components.backWall[0].name);
  const [mounting, setMounting] = useState(data.components.mounting[0].name);
  const [workType, setWorkType] = useState(data.workTypes[0].name);

  // Пошук багету
  const filteredBaguettes = useMemo(() => {
    if (!baguetteSearch.trim()) return [];
    const search = baguetteSearch.toLowerCase();
    return data.baguette
      .filter(b => b.article.toLowerCase().includes(search))
      .slice(0, 10);
  }, [baguetteSearch, data.baguette]);

  // Пошук паспарту
  const filteredPassepartout1 = useMemo(() => {
    if (!passepartout1Search.trim()) return [];
    const search = passepartout1Search.toLowerCase();
    return data.passepartout
      .filter(p => p.article.toLowerCase().includes(search) || p.name.toLowerCase().includes(search))
      .slice(0, 10);
  }, [passepartout1Search, data.passepartout]);

  const filteredPassepartout2 = useMemo(() => {
    if (!passepartout2Search.trim()) return [];
    const search = passepartout2Search.toLowerCase();
    return data.passepartout
      .filter(p => p.article.toLowerCase().includes(search) || p.name.toLowerCase().includes(search))
      .slice(0, 10);
  }, [passepartout2Search, data.passepartout]);

  // ============================================================================
  // РОЗРАХУНКИ
  // ============================================================================

  const calculations = useMemo(() => {
    if (!selectedBaguette || !width || !height) {
      return { total: 0, details: [] };
    }

    const w = parseFloat(width);
    const h = parseFloat(height);
    
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return { total: 0, details: [] };
    }

    let total = 0;
    const details = [];

    // Визначаємо внутрішній розмір рамки
    let innerWidth = w;
    let innerHeight = h;

    // Якщо з паспарту - розраховуємо поля
    if (withPassepartout && selectedPassepartout1 && passepartout1Field) {
      const field1 = parseFloat(passepartout1Field);
      if (!isNaN(field1) && field1 > 0) {
        let field1Actual = field1;
        
        // Якщо є друге паспарту - сумуємо поля для першого
        if (showPassepartout2 && selectedPassepartout2 && passepartout2Field) {
          const field2 = parseFloat(passepartout2Field);
          if (!isNaN(field2) && field2 > 0) {
            field1Actual = field1 + field2;
            
            // Розраховуємо друге (верхнє) паспарту
            const p2Width = (w + field2 * 2) / 1000; // в метри
            const p2Height = (h + field2 * 2) / 1000;
            const p2Area = p2Width * p2Height;
            const p2Cost = p2Area * selectedPassepartout2.pricePerM2;
            total += p2Cost;
            details.push({
              name: `Паспарту (верхнє): ${selectedPassepartout2.name}`,
              value: `${p2Area.toFixed(4)} м² × ${selectedPassepartout2.pricePerM2} грн`,
              cost: p2Cost
            });
          }
        }

        // Розраховуємо перше (нижнє) паспарту
        const p1Width = (w + field1Actual * 2) / 1000;
        const p1Height = (h + field1Actual * 2) / 1000;
        const p1Area = p1Width * p1Height;
        const p1Cost = p1Area * selectedPassepartout1.pricePerM2;
        total += p1Cost;
        details.push({
          name: `Паспарту (нижнє): ${selectedPassepartout1.name}`,
          value: `${p1Area.toFixed(4)} м² × ${selectedPassepartout1.pricePerM2} грн`,
          cost: p1Cost
        });

        // Внутрішній розмір рамки = розмір паспарту
        innerWidth = w + field1Actual * 2;
        innerHeight = h + field1Actual * 2;
      }
    }

    // Зовнішній розмір рамки
    const outerWidth = innerWidth + selectedBaguette.additionalSize * 2;
    const outerHeight = innerHeight + selectedBaguette.additionalSize * 2;

    // Багет (погонні метри)
    const baguettePerimeter = ((outerWidth + outerHeight) * 2) / 1000;
    const baguetteCost = baguettePerimeter * selectedBaguette.pricePerMeter;
    total += baguetteCost;
    details.push({
      name: `Багет: ${selectedBaguette.article}`,
      value: `${baguettePerimeter.toFixed(3)} м × ${selectedBaguette.pricePerMeter} грн`,
      cost: baguetteCost
    });

    // Внутрішня стінка
    const innerWallItem = data.components.innerWall.find(item => item.name === innerWall);
    if (innerWallItem && innerWallItem.type !== 'none') {
      const innerArea = (innerWidth * innerHeight) / 1000000;
      
      if (innerWallItem.type === 'area') {
        const cost = innerArea * innerWallItem.pricePerM2;
        total += cost;
        details.push({
          name: `Внутрішня стінка: ${innerWall}`,
          value: `${innerArea.toFixed(4)} м² × ${innerWallItem.pricePerM2} грн`,
          cost
        });
      } else if (innerWallItem.type === 'perimeter') {
        const perimeter = ((innerWidth + innerHeight) * 2) / 1000;
        const cost = perimeter * innerWallItem.pricePerMeter;
        total += cost;
        details.push({
          name: `Внутрішня стінка: ${innerWall}`,
          value: `${perimeter.toFixed(3)} м × ${innerWallItem.pricePerMeter} грн`,
          cost
        });
      } else if (innerWallItem.type === 'combined') {
        const areaCost = innerArea * innerWallItem.pricePerM2;
        const perimeter = ((innerWidth + innerHeight) * 2) / 1000;
        const perimeterCost = perimeter * innerWallItem.pricePerMeter;
        const combinedCost = areaCost + perimeterCost;
        total += combinedCost;
        details.push({
          name: `Внутрішня стінка: ${innerWall}`,
          value: `ДВП ${innerArea.toFixed(4)} м² × ${innerWallItem.pricePerM2} + Підрамник ${perimeter.toFixed(3)} м × ${innerWallItem.pricePerMeter} грн`,
          cost: combinedCost
        });
      }
    }

    // Скло
    const glassItem = data.components.glass.find(item => item.name === glass);
    if (glassItem && glassItem.pricePerM2 > 0) {
      const glassArea = (innerWidth * innerHeight) / 1000000;
      const glassCost = glassArea * glassItem.pricePerM2;
      total += glassCost;
      details.push({
        name: `Скло: ${glass}`,
        value: `${glassArea.toFixed(4)} м² × ${glassItem.pricePerM2} грн`,
        cost: glassCost
      });
    }

    // Задня стінка
    const backWallItem = data.components.backWall.find(item => item.name === backWall);
    if (backWallItem && backWallItem.pricePerM2 > 0) {
      const backWidth = (outerWidth - 3) / 1000;
      const backHeight = (outerHeight - 3) / 1000;
      const backArea = backWidth * backHeight;
      const backCost = backArea * backWallItem.pricePerM2;
      total += backCost;
      details.push({
        name: `Задня стінка: ${backWall}`,
        value: `${backArea.toFixed(4)} м² × ${backWallItem.pricePerM2} грн`,
        cost: backCost
      });
    }

    // Кріплення
    const mountingItem = data.components.mounting.find(item => item.name === mounting);
    if (mountingItem && mountingItem.price > 0) {
      total += mountingItem.price;
      details.push({
        name: `Кріплення: ${mounting}`,
        value: `${mountingItem.price} грн`,
        cost: mountingItem.price
      });
    }

    // Тип роботи
    const workTypeItem = data.workTypes.find(item => item.name === workType);
    if (workTypeItem) {
      total += workTypeItem.price;
      details.push({
        name: `Робота: ${workType}`,
        value: `${workTypeItem.price} грн`,
        cost: workTypeItem.price
      });
    }

    return { total, details };
  }, [selectedBaguette, width, height, withPassepartout, selectedPassepartout1, passepartout1Field, 
      showPassepartout2, selectedPassepartout2, passepartout2Field, innerWall, glass, backWall, mounting, workType, data]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Калькулятор вартості рамок</h1>
          <p className="text-sm text-gray-600 mt-1">Розрахунок вартості оформлення фото та вишивок</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Багет *
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={baguetteSearch}
                  onChange={(e) => {
                    setBaguetteSearch(e.target.value);
                    setSelectedBaguette(null);
                  }}
                  placeholder="Почніть вводити артикул (напр. AM1515-015)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {filteredBaguettes.length > 0 && !selectedBaguette && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredBaguettes.map((item) => (
                    <button
                      key={item.article}
                      onClick={() => {
                        setSelectedBaguette(item);
                        setBaguetteSearch(item.article);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <div className="font-medium text-gray-900">{item.article}</div>
                      <div className="text-sm text-gray-600">{item.pricePerMeter} грн/м</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedBaguette && (
              <div className="mt-2 text-sm text-green-600">
                ✓ Обрано: {selectedBaguette.article} ({selectedBaguette.pricePerMeter} грн/м)
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Паспарту
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={!withPassepartout}
                  onChange={() => {
                    setWithPassepartout(false);
                    setShowPassepartout2(false);
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Без паспарту</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={withPassepartout}
                  onChange={() => setWithPassepartout(true)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">З паспарту</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {withPassepartout ? 'Розмір вікна паспарту (мм) *' : 'Розміри (мм) *'}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Ширина"
                min="50"
                max="3000"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Висота"
                min="50"
                max="3000"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {withPassepartout && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {showPassepartout2 ? 'Паспарту (нижнє)' : 'Паспарту'}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={passepartout1Search}
                    onChange={(e) => {
                      setPassepartout1Search(e.target.value);
                      setSelectedPassepartout1(null);
                    }}
                    placeholder="Пошук паспарту"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {filteredPassepartout1.length > 0 && !selectedPassepartout1 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredPassepartout1.map((item) => (
                        <button
                          key={item.article}
                          onClick={() => {
                            setSelectedPassepartout1(item);
                            setPassepartout1Search(item.article);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100"
                        >
                          <div className="font-medium text-gray-900">{item.article}</div>
                          <div className="text-sm text-gray-600">{item.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  value={passepartout1Field}
                  onChange={(e) => setPassepartout1Field(e.target.value)}
                  placeholder={showPassepartout2 ? "Видима ширина поля (мм)" : "Ширина поля (мм)"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {showPassepartout2 && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Паспарту (верхнє)
                    </label>
                    <button
                      onClick={() => {
                        setShowPassepartout2(false);
                        setSelectedPassepartout2(null);
                        setPassepartout2Search('');
                        setPassepartout2Field('');
                      }}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={passepartout2Search}
                      onChange={(e) => {
                        setPassepartout2Search(e.target.value);
                        setSelectedPassepartout2(null);
                      }}
                      placeholder="Пошук паспарту"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {filteredPassepartout2.length > 0 && !selectedPassepartout2 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredPassepartout2.map((item) => (
                          <button
                            key={item.article}
                            onClick={() => {
                              setSelectedPassepartout2(item);
                              setPassepartout2Search(item.article);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            <div className="font-medium text-gray-900">{item.article}</div>
                            <div className="text-sm text-gray-600">{item.name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    value={passepartout2Field}
                    onChange={(e) => setPassepartout2Field(e.target.value)}
                    placeholder="Видима ширина поля (мм)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {!showPassepartout2 && (
                <button
                  onClick={() => setShowPassepartout2(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Додати друге паспарту
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Внутрішня стінка
            </label>
            <select
              value={innerWall}
              onChange={(e) => setInnerWall(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {data.components.innerWall.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Скло
            </label>
            <select
              value={glass}
              onChange={(e) => setGlass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {data.components.glass.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Задня стінка
            </label>
            <select
              value={backWall}
              onChange={(e) => setBackWall(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {data.components.backWall.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Кріплення
            </label>
            <select
              value={mounting}
              onChange={(e) => setMounting(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {data.components.mounting.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип роботи
            </label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {data.workTypes.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        {calculations.total > 0 && (
          <div className="bg-blue-50 rounded-lg shadow-sm p-6 mt-6 border-2 border-blue-200">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Загальна вартість</div>
              <div className="text-4xl font-bold text-blue-600">
                {calculations.total.toFixed(2)} грн
              </div>
            </div>
            
            {SHOW_ITEM_PRICES && calculations.details.length > 0 && (
              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="text-sm font-medium text-gray-700 mb-3">Деталізація:</div>
                <div className="space-y-2">
                  {calculations.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{detail.name}</span>
                      <span className="font-medium text-gray-900">{detail.cost.toFixed(2)} грн</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Інструкція з підключення Google Sheets</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. Створіть Google Таблицю з такою структурою:</p>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-xs space-y-2">
              <div>
                <strong>Вкладка "Багет":</strong><br/>
                Артикул | Модель | Колір | Ціна_за_метр | Ширина_профілю | Додатковий_розмір
              </div>
              <div>
                <strong>Вкладка "Паспарту":</strong><br/>
                Артикул | Назва | Ціна_за_м2
              </div>
              <div>
                <strong>Вкладка "Внутрішня_стінка":</strong><br/>
                Назва | Ціна_за_м2 | Ціна_за_метр | Тип
              </div>
              <div>
                <strong>Вкладка "Скло":</strong><br/>
                Назва | Ціна_за_м2
              </div>
              <div>
                <strong>Вкладка "Задня_стінка":</strong><br/>
                Назва | Ціна_за_м2
              </div>
              <div>
                <strong>Вкладка "Кріплення":</strong><br/>
                Назва | Ціна
              </div>
              <div>
                <strong>Вкладка "Роботи":</strong><br/>
                Назва | Ціна
              </div>
            </div>
            <p>2. Зробіть таблицю публічною (Файл → Налаштування спільного доступу → Будь-хто з посиланням може переглядати)</p>
            <p>3. Скопіюйте URL таблиці та замініть у коді константу GOOGLE_SHEETS_URL</p>
            <p className="text-amber-600 font-medium">⚠️ Поки що калькулятор працює з тестовими даними</p>
          </div>
        </div>
      </div>
    </div>
  );
}