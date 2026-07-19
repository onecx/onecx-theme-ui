import { TestBed } from '@angular/core/testing'
import { SlotService } from '@onecx/angular-remote-components'
import { injectInitializedSlotService } from './slot.initializer'

describe('injectInitializedSlotService', () => {
  let slotServiceSpy: jasmine.SpyObj<SlotService>

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SlotService', ['init'])

    TestBed.configureTestingModule({
      providers: [{ provide: SlotService, useValue: spy }]
    })

    slotServiceSpy = TestBed.inject(SlotService) as jasmine.SpyObj<SlotService>
  })

  it('should inject SlotService and immediately call the init() method', () => {
    let resultService: SlotService | undefined

    TestBed.runInInjectionContext(() => {
      resultService = injectInitializedSlotService()
    })

    expect(resultService).toBe(slotServiceSpy)
    expect(slotServiceSpy.init).toHaveBeenCalledTimes(1)
  })
})
